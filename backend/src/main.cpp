#define ASIO_STANDALONE

#include "crow_all.h"
#include "Metrics.h"
#include "Patient.h"
#include "Scheduler.h"

#include <string>
#include <utility>
#include <vector>

namespace {

crow::response jsonError(int status, const std::string& message) {
    crow::json::wvalue body;
    body["error"] = message;
    return crow::response(status, body);
}

crow::response swaggerUi() {
    static const char html[] = R"HTML(
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Hospital Scheduler API</title>
  <link rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => SwaggerUIBundle({
      url: "/openapi.json",
      dom_id: "#swagger-ui"
    });
  </script>
</body>
</html>
)HTML";

    crow::response response(html);
    response.set_header("Content-Type", "text/html; charset=utf-8");
    return response;
}

crow::response openApiSpec() {
    static const char spec[] = R"JSON({
  "openapi": "3.0.3",
  "info": {
    "title": "Hospital Scheduler API",
    "version": "1.0.0"
  },
  "paths": {
    "/api/simulate": {
      "post": {
        "summary": "Run the FCFS patient scheduling simulation",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/SimulationRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Simulation metrics and timeline",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/SimulationResponse"
                }
              }
            }
          },
          "400": {
            "description": "Invalid patient workload"
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "PatientWorkload": {
        "type": "object",
        "required": ["id", "arrivalTime", "treatmentTime", "priority"],
        "properties": {
          "id": { "type": "integer", "minimum": 0 },
          "arrivalTime": { "type": "integer", "minimum": 0 },
          "treatmentTime": { "type": "integer", "minimum": 1 },
          "priority": { "type": "integer", "minimum": 1, "maximum": 5 }
        }
      },
      "SimulationRequest": {
        "type": "object",
        "required": ["patients"],
        "properties": {
          "patients": {
            "type": "array",
            "items": { "$ref": "#/components/schemas/PatientWorkload" }
          }
        }
      },
      "SimulationResponse": {
        "type": "object",
        "properties": {
          "metrics": { "type": "object" },
          "timeline": { "type": "array", "items": { "type": "object" } },
          "processedPatients": {
            "type": "array",
            "items": { "$ref": "#/components/schemas/PatientWorkload" }
          }
        }
      }
    }
  }
})JSON";

    crow::response response(spec);
    response.set_header("Content-Type", "application/json");
    return response;
}

crow::json::wvalue patientJson(const Patient& patient) {
    crow::json::wvalue value;
    value["id"] = patient.id;
    value["arrivalTime"] = patient.arrivalTime;
    value["treatmentTime"] = patient.treatmentTime;
    value["priority"] = patient.priority_level;
    value["firstStartTime"] = patient.firstStartTime;
    value["completionTime"] = patient.completionTime;
    value["waitingTime"] = patient.waitingTime;
    value["turnaroundTime"] = patient.turnaroundTime;
    return value;
}

crow::json::wvalue timelineJson(const std::vector<TimeSlot>& timeline) {
    crow::json::wvalue slots = crow::json::wvalue::list();
    for (std::size_t index = 0; index < timeline.size(); ++index) {
        const auto& slot = timeline[index];
        crow::json::wvalue value;
        value["startTime"] = slot.startTime;
        value["endTime"] = slot.endTime;
        value["patientId"] = slot.patientId;
        slots[static_cast<unsigned>(index)] = std::move(value);
    }
    return slots;
}

crow::response simulate(const crow::request& request) {
    const auto body = crow::json::load(request.body);
    if (!body || !body.has("patients")) {
        return jsonError(400, "Request body must contain a patients array");
    }

    const auto patientsJson = body["patients"];
    if (patientsJson.t() != crow::json::type::List) {
        return jsonError(400, "patients must be an array");
    }

    std::vector<Patient> patients;
    patients.reserve(patientsJson.size());

    for (std::size_t index = 0; index < patientsJson.size(); ++index) {
        const auto patient = patientsJson[index];
        if (!patient.has("id") || !patient.has("arrivalTime") ||
            !patient.has("treatmentTime") || !patient.has("priority")) {
            return jsonError(400, "Each patient requires id, arrivalTime, treatmentTime, and priority");
        }

        const int id = patient["id"].i();
        const int arrivalTime = patient["arrivalTime"].i();
        const int treatmentTime = patient["treatmentTime"].i();
        const int priority = patient["priority"].i();
        if (id < 0 || arrivalTime < 0 || treatmentTime <= 0 ||
            priority < 1 || priority > 5) {
            return jsonError(400, "Patient values are outside the allowed ranges");
        }

        patients.emplace_back(id, arrivalTime, treatmentTime, priority);
    }

    FCFSScheduler scheduler;
    const SimulationMetrics metrics = scheduler.run(std::move(patients));

    crow::json::wvalue response;
    response["metrics"]["algorithmName"] = metrics.algorithmName;
    response["metrics"]["avgWaitingTime"] = metrics.avgWaitingTime;
    response["metrics"]["avgTurnaroundTime"] = metrics.avgTurnaroundTime;
    response["metrics"]["avgResponseTime"] = metrics.avgResponseTime;
    response["metrics"]["criticalCaseAvgResponseTime"] =
        metrics.criticalCaseAvgResponseTime;
    response["metrics"]["doctorUtilization"] = metrics.doctorUtilization;
    response["metrics"]["totalSimulationTime"] = metrics.totalSimulationTime;
    response["timeline"] = timelineJson(metrics.timeline);

    crow::json::wvalue processed = crow::json::wvalue::list();
    for (std::size_t index = 0; index < metrics.processedPatients.size(); ++index) {
        processed[static_cast<unsigned>(index)] =
            patientJson(metrics.processedPatients[index]);
    }
    response["processedPatients"] = std::move(processed);
    return crow::response(response);
}

}  // namespace

int main() {
    crow::SimpleApp app;

    CROW_ROUTE(app, "/swagger").methods(crow::HTTPMethod::GET)(swaggerUi);
    CROW_ROUTE(app, "/openapi.json").methods(crow::HTTPMethod::GET)(openApiSpec);
    CROW_ROUTE(app, "/api/simulate")
        .methods(crow::HTTPMethod::POST)(simulate);

    app.port(18080).multithreaded().run();
    return 0;
}