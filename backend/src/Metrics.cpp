#include "../include/Metrics.h"
#include <iostream>
#include <iomanip>
using namespace std;

SimulationMetrics MetricsCalculator::calculate(
    const string& algoName,
    vector<Patient>& patients,
    vector<TimeSlot>& timeline,
    int totalTime
){
    SimulationMetrics metrics;
    metrics.algorithmName = algoName;
    metrics.processedPatients = patients;
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

    metrics.avgWaitingTime = totalWT / patients.size();
    metrics.avgTurnaroundTime = totalTAT / patients.size();
    metrics.avgResponseTime = totalRT / patients.size();
    if (criticalCount > 0) metrics.criticalCaseAvgResponseTime = criticalRT / criticalCount;
    if (totalTime > 0) metrics.doctorUtilization = ((double)totalBusyTime / totalTime) * 100;

    return metrics;
}

// Display just for Testing
void MetricsCalculator::printReport(const SimulationMetrics& metrics) {
    std::cout << "\n==========================================" << std::endl;
    std::cout << " SCHEDULING REPORT: " << metrics.algorithmName << std::endl;
    std::cout << "==========================================" << std::endl;
    std::cout << std::left << std::setw(8) << "ID"
              << std::setw(10) << "Arrival"
              << std::setw(12) << "Treatment"
              << std::setw(10) << "Triage"
              << std::setw(12) << "Start"
              << std::setw(12) << "Completion"
              << std::setw(10) << "Wait"
              << std::setw(10) << "TAT" << "\n";
    std::cout << "--------------------------------------------------------------------------------\n";

    for (const auto& p : metrics.processedPatients) {
        std::cout << std::left << std::setw(8) << p.id
                  << std::setw(10) << p.arrivalTime
                  << std::setw(12) << p.treatmentTime
                  << std::setw(10) << p.priority_level
                  << std::setw(12) << p.firstStartTime
                  << std::setw(12) << p.completionTime
                  << std::setw(10) << p.waitingTime
                  << std::setw(10) << p.turnaroundTime << "\n";
    }

    std::cout << "--------------------------------------------------------------------------------\n";
    std::cout << std::fixed << std::setprecision(2);
    std::cout << "Avg Waiting Time:         " << metrics.avgWaitingTime << " units\n";
    std::cout << "Avg Turnaround Time:      " << metrics.avgTurnaroundTime << " units\n";
    std::cout << "Avg Response Time:        " << metrics.avgResponseTime << " units\n";
    std::cout << "Critical Case Avg Response:" << metrics.criticalCaseAvgResponseTime << " units\n";
    std::cout << "Doctor Utilization:       " << metrics.doctorUtilization << "%\n";
    
    std::cout << "\nTimeline (Gantt Chart Slices):\n";
    for (const auto& slot : metrics.timeline) {
        std::cout << "[" << slot.startTime << " - " << slot.endTime << "] -> Patient " << slot.patientId << "\n";
    }
    std::cout << "==========================================\n\n";
}