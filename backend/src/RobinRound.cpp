#include "../include/Scheduler.h"
#include <algorithm>
#include <queue>

using namespace std;

SimulationMetrics RobinRoundScheduler::run(vector<Patient> inputPatients){
    vector<Patient>patients = inputPatients;
    sort(patients.begin() , patients.end() , [](Patient& a , Patient& b){
        return a.arrivalTime < b.arrivalTime;
    } );

    vector<Patient> completed;
    vector<TimeSlot> timeline;
    queue<Patient> readyQueue;

    int currentTime = 0;
    int totalPatients = patients.size();
    int patient_idx = 0;

    while(completed.size() < totalPatients){
        while(patient_idx < patients.size() && patients[patient_idx].arrivalTime <= currentTime){
            readyQueue.push(patients[patient_idx]);
            patient_idx++;
        }

        if (readyQueue.empty()){
            currentTime = patients[patient_idx].arrivalTime;
            continue;
        }

        Patient current = readyQueue.front();
        readyQueue.pop();

        if(current.firstStartTime == -1){
            current.firstStartTime = currentTime;
        }

        int slice = min(timeQuantum , current.remainingTime);
        int startTime = currentTime;
        currentTime += slice;
        current.remainingTime -= slice;

        timeline.push_back({startTime , currentTime , current.id});

        while(patient_idx < patients.size() && patients[patient_idx].arrivalTime <= currentTime){
            readyQueue.push(patients[patient_idx]);
            patient_idx++;
        }

        if(current.remainingTime == 0){
            current.completionTime = currentTime;
            completed.push_back(current);
        } else {
            readyQueue.push(current);
        }
    }
    return MetricsCalculator::calculate(
        "Robin Round (Q =" + to_string(timeQuantum) + ")",
        completed,
        timeline,
        currentTime
    );
}