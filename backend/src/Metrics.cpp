#include "../include/Metrics.h"
#include <iostream>
#include <iomanip>
using namespace std;

SimulationMetrics MetricsCalculator::calculate(
    string& algoName,
    vector<Patient>& patients,
    vector<TimeSlot>& timeline,
    int totalTime
){
    SimulationMetrics metrics;
    metrics.algorithmName = algoName;
    metrics.timeline = timeline;
    metrics.totalSimulationTime = totalTime;

    if (patients.empty()) return metrics;

    double totalWT = 0, totalTAT = 0, totalRT = 0;
    double criticalRT = 0;
    int criticalCount = 0;
    int totalBusyTime = 0;

    for (const auto& slot : timeline){
        totalBusyTime += (slot.endTime - slot.startTime);
    }

    for (auto&p : patients){
        p.turnaroundTime = p.completionTime - p.arrivalTime;
        p.waitingTime = p.turnaroundTime - p.treatmentTime;
        int responseTime = p.firstStartTime - p.arrivalTime;

        totalWT += p.waitingTime;
        totalTAT += p.turnaroundTime;
        totalRT += responseTime;

        if (p.priority_level <= 2){
            criticalRT += responseTime;
            criticalCount++;
        }
    }

    metrics.processedPatients = patients;
    metrics.avgWaitingTime = totalWT / patients.size();
    metrics.avgTurnaroundTime = totalTAT / patients.size();
    metrics.avgResponseTime = totalRT / patients.size();
    if (criticalCount > 0) metrics.criticalCaseAvgResponseTime = criticalRT / criticalCount;
    if (totalTime > 0) metrics.doctorUtilization = ((double)totalBusyTime / totalTime) * 100;

    return metrics;
}