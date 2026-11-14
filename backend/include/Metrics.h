#ifndef METRICS_H
#define METRICS_H

#include "Patient.h"
#include <vector>
#include <string>

using namespace std;

struct TimeSlot{
    int startTime;
    int endTime;
    int patientId;
};

struct SimulationMetrics{
    string algorithmName;
    double avgWaitingTime = 0.0;
    double avgTurnaroundTime = 0.0;
    double avgResponseTime = 0.0;
    double criticalCaseAvgResponseTime = 0.0;       // Priority 1 and 2
    double doctorUtilization = 0.0;
    int totalSimulationTime = 0.0;

    vector<Patient> processedPatients;
    vector<TimeSlot> timeline;                      // For Gantt Chart Visualisation
};

class MetricsCalculator{
public:
    static SimulationMetrics calculate(
        string& algoName,
        vector<Patient>& patients,
        vector<TimeSlot>& timeline,
        int totalTime
    );

    static void printReport(const SimulationMetrics& metric);
};

#endif