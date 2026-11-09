#include "../include/Scheduler.h"
#include <algorithm>
#include <vector>

using namespace std;

SimulationMetrics NonPreemptiveSFJScheduler::run(vector<Patient> patients){

    vector<TimeSlot> timeline;
    vector<Patient> completed;
    int currentTime = 0;
    int totalPatients = patients.size();

    vector<bool> isCompleted(totalPatients , false);

    while(completed.size() < totalPatients){
        int idx = -1;
        int minTreatment = 1e9;

        for (int i = 0; i < patients.size(); i++){
            if (!isCompleted[i] && patients[i].arrivalTime <= currentTime){
                if (patients[i].treatmentTime < minTreatment){
                    minTreatment = patients[i].treatmentTime;
                    idx = i;
                } else if (patients[i].treatmentTime == minTreatment){
                    if (patients[i].arrivalTime < patients[idx].arrivalTime){
                        idx = i;
                    }
                }
            }
        }

        if (idx == -1){
            currentTime++;
            continue;
        }

        Patient& p = patients[idx];
        int startTime = currentTime;
        p.firstStartTime = startTime;
        currentTime += p.treatmentTime;
        p.completionTime = currentTime;

        timeline.push_back({startTime , currentTime , p.id});
        completed.push_back(p);
        isCompleted[idx] = true;
    }
    
    return MetricsCalculator::calculate("Non-Preemptive SJF" , completed , timeline , currentTime);
}

SimulationMetrics PreemptiveSRTFScheduer::run(vector<Patient> patients){
    vector<Patient> completed;
    vector<TimeSlot> timeline;

    int currentTime = 0;
    int totalPatients = patients.size();

    int lastPatientId = -1;
    int slotStartTime = 0;

    while(completed.size() < totalPatients){
        int idx = -1;
        int minRemaining = 1e9;

        for(int i = 0 ; i < patients.size(); i++){
            if (patients[i].remainingTime > 0 && patients[i].arrivalTime <= currentTime){
                if (patients[i].remainingTime < minRemaining){
                    minRemaining = patients[i].remainingTime;
                    idx = i;
                } else if (patients[i].remainingTime == minRemaining){
                    if (patients[i].arrivalTime < patients[idx].arrivalTime){
                        idx = i;
                    }
                }
            }
        }
        if (idx == -1){
            if (lastPatientId != -1){
                timeline.push_back({slotStartTime , currentTime , lastPatientId});
                lastPatientId = -1;
            }
            currentTime++;
            continue;
        }

        Patient& p = patients[idx];
        if (p.firstStartTime == -1){
            p.firstStartTime = currentTime;
        }

        if (p.id != lastPatientId){
            if (lastPatientId != -1){
                timeline.push_back({slotStartTime , currentTime , lastPatientId});
            }
            slotStartTime = currentTime;
            lastPatientId = p.id;
        }
        p.remainingTime --;
        currentTime++;

        if (p.remainingTime == 0){
            p.completionTime = currentTime;
            timeline.push_back({slotStartTime , currentTime , p.id});
            lastPatientId = -1;
            completed.push_back(p);
        }
    }

    return MetricsCalculator::calculate("Preemptive SRTF" , completed , timeline , currentTime);
}