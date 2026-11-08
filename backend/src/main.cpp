#define ASIO_STANDALONE
#include "../include/crow_all.h"
#include "../include/Patient.h"
#include "../include/Scheduler.h"
#include "../include/Metrics.h"
#include <vector>
#include <string>

int main() {
    crow::SimpleApp app;

    // -------------------------------------------------------------
    // 1. SWAGGER UI ENDPOINT (GET /swagger)
    // -------------------------------------------------------------
    CROW_ROUTE(app, "/swagger")
    ([]() {
        std::string html = R"(
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Hospital Emergency Department Simulator - Swagger UI</title>
                <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
            </head>
            <body>
                <div id="swagger-ui"></div>
                <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
                <script>
                    window.onload = () => {
                        SwaggerUIBundle({
                            url: '/openapi.json',
                            dom_id: '#swagger-ui',
                        });
                    };
                </script>
            </body>
            </html>
        )";
        return crow::response(html);
    });

    // -------------------------------------------------------------
    // 2. OPENAPI SPECIFICATION ENDPOINT (GET /openapi.json)
    // -------------------------------------------------------------
    CROW_ROUTE(app, "/openapi.json")
    ([]() {
        crow::json::wvalue spec;
        spec["openapi"] = "3.0.0";
        spec["info"]["title"] = "Hospital Process Scheduling API";
        spec["info"]["version"] = "1.0.0";
        spec["info"]["description"] = "C++ Process Scheduling Simulator for Hospital Patient Triage";

        spec["paths"]["/api/simulate"]["post"]["summary"] = "Run Patient Simulation";
        spec["paths"]["/api/simulate"]["post"]["description"] = "Executes the selected OS scheduling algorithm on a user-provided list of patients.";

        spec["paths"]["/api/simulate"]["post"]["requestBody"]["required"] = true;
        spec["paths"]["/api/simulate"]["post"]["requestBody"]["content"]["application/json"]["schema"]["type"] = "object";
        spec["paths"]["/api/simulate"]["post"]["requestBody"]["content"]["application/json"]["schema"]["properties"]["algorithm"]["type"] = "string";
        spec["paths"]["/api/simulate"]["post"]["requestBody"]["content"]["application/json"]["schema"]["properties"]["algorithm"]["example"] = "FCFS";

        auto& patientsSchema = spec["paths"]["/api/simulate"]["post"]["requestBody"]["content"]["application/json"]["schema"]["properties"]["patients"];
        patientsSchema["type"] = "array";
        patientsSchema["items"]["type"] = "object";
        patientsSchema["items"]["properties"]["id"]["type"] = "integer";
        patientsSchema["items"]["properties"]["arrivalTime"]["type"] = "integer";
        patientsSchema["items"]["properties"]["treatmentTime"]["type"] = "integer";
        patientsSchema["items"]["properties"]["triageLevel"]["type"] = "integer";

        crow::response res(spec);
        res.add_header("Content-Type", "application/json");
        return res;
    });

    // -------------------------------------------------------------
    // 3. CORE SIMULATION API ENDPOINT (POST /api/simulate)
    // -------------------------------------------------------------
    CROW_ROUTE(app, "/api/simulate").methods(crow::HTTPMethod::POST)
    ([](const crow::request& req) {
        auto body = crow::json::load(req.body);
        if (!body) {
            return crow::response(400, "Invalid JSON body provided");
        }

        if (!body.has("patients")) {
            return crow::response(400, "Missing 'patients' array in request JSON");
        }

        std::string algo = body.has("algorithm") ? body["algorithm"].s() : "FCFS";
        
        std::vector<Patient> workload;
        for (const auto& item : body["patients"]) {
            workload.push_back(Patient(
                item["id"].i(),
                item["arrivalTime"].i(),
                item["treatmentTime"].i(),
                item["triageLevel"].i()
            ));
        }

        if (workload.empty()) {
            return crow::response(400, "Patient workload list cannot be empty");
        }

        SimulationMetrics metrics;
        if (algo == "FCFS") {
            FCFSScheduler scheduler;
            metrics = scheduler.run(workload);
        } else {
            return crow::response(400, "Unsupported algorithm selected");
        }

        crow::json::wvalue response;
        response["algorithm"] = metrics.algorithmName;
        response["avgWaitingTime"] = metrics.avgWaitingTime;
        response["avgTurnaroundTime"] = metrics.avgTurnaroundTime;
        response["avgResponseTime"] = metrics.avgResponseTime;
        response["criticalCaseAvgResponseTime"] = metrics.criticalCaseAvgResponseTime;
        response["doctorUtilization"] = metrics.doctorUtilization;
        response["totalSimulationTime"] = metrics.totalSimulationTime;

        int i = 0;
        for (const auto& p : metrics.processedPatients) {
            response["processedPatients"][i]["id"] = p.id;
            response["processedPatients"][i]["arrivalTime"] = p.arrivalTime;
            response["processedPatients"][i]["treatmentTime"] = p.treatmentTime;
            response["processedPatients"][i]["triageLevel"] = p.triageLevel;
            response["processedPatients"][i]["firstStartTime"] = p.firstStartTime;
            response["processedPatients"][i]["completionTime"] = p.completionTime;
            response["processedPatients"][i]["waitingTime"] = p.waitingTime;
            response["processedPatients"][i]["turnaroundTime"] = p.turnaroundTime;
            i++;
        }

        int j = 0;
        for (const auto& slot : metrics.timeline) {
            response["timeline"][j]["startTime"] = slot.startTime;
            response["timeline"][j]["endTime"] = slot.endTime;
            response["timeline"][j]["patientId"] = slot.patientId;
            j++;
        }

        return crow::response(response);
    });

    std::cout << "---------------------------------------------------------\n";
    std::cout << "C++ Hospital Scheduler Server running at: http://localhost:18080\n";
    std::cout << "Swagger UI active at:                 http://localhost:18080/swagger\n";
    std::cout << "---------------------------------------------------------\n";
    
    app.port(18080).multithreaded().run();
}