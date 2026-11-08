#include "../include/Scheduler.h"
#include <algorithm>
#include <queue>

using namespace std;

SimulationMetrics FCFSScheduler::run(vector<Patient> patients){
    sort(patients.begin() , patients.end() , [](const Patient& a , const Patient& b){
        return a.arrivalTime < b.arrivalTime;
    });

    vector<TimeSlot> timeline;
    vector<Patient> completedPatients;
    queue<Patient> readyQueue;

    int currentTime = 0;
    int Patient_idx = 0;
    int totalPatients = patients.size();

    while (completedPatients.size() < totalPatients){
        while(Patient_idx < patients.size() && patients[Patient_idx].arrivalTime <= currentTime){
            readyQueue.push(patients[Patient_idx]);
            Patient_idx++;
        }

        if (readyQueue.empty()){
            if (Patient_idx < totalPatients){
                currentTime = patients[Patient_idx].arrivalTime;
            }
            continue;
        }

        Patient currentPatient = readyQueue.front();
        readyQueue.pop();

        int startTime = currentTime;
        currentPatient.firstStartTime = startTime;
        currentTime += currentPatient.treatmentTime;
        currentPatient.completionTime = currentTime;

        timeline.push_back({startTime , currentTime , currentPatient.id});
        completedPatients.push_back(currentPatient);
    }
    return MetricsCalculator::calculate("FCFS" , completedPatients , timeline, currentTime);
}