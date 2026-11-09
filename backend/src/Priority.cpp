#include "../include/Scheduler.h"
#include <vector>
#include <algorithm>

SimulationMetrics NonPreemptivePriorityScheduler::run(vector<Patient> patients){
    vector<Patient> completed;
    vector<TimeSlot> timeline;
    int currentTime = 0;
    int totalPatients = patients.size();
    vector<bool> isCompleted(totalPatients , false);

    while(completed.size() < totalPatients){
        int idx = -1;
        int highestPriority = 1e9;

        for (int i = 0; i < patients.size(); i++){
            if (!isCompleted[i] && patients[i].arrivalTime <= currentTime){
                if (patients[i].priority_level < highestPriority){
                    highestPriority = patients[i].priority_level;
                    idx = i;
                }else if (patients[i].priority_level == highestPriority){
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
        p.firstStartTime = currentTime;
        currentTime += p.treatmentTime;
        p.completionTime = currentTime;

        timeline.push_back({startTime , currentTime , p.id});
        completed.push_back(p);
        isCompleted[idx] = true;
    }
    return MetricsCalculator::calculate("Non-Preemptive Priority" , completed , timeline , currentTime);
}

SimulationMetrics PreemptivePriorityScheduler::run(vector<Patient> patients){
    vector<Patient> completed;
    vector<TimeSlot> timeline;
    int currentTime = 0;
    int totalPatients = patients.size();

    int lastPatientId = -1;
    int slotStartTime = 0;

    while(completed.size() < totalPatients){
        int idx = -1;
        int highestPriority = 1e9;

        for (int i = 0; i < patients.size(); i++){
            if (patients[i].remainingTime > 0 && patients[i].arrivalTime <= currentTime){
                if (patients[i].priority_level < highestPriority){
                    highestPriority = patients[i].priority_level;
                    idx = i;
                } else if (patients[i].priority_level == highestPriority){
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
                timeline.push_back({slotStartTime , currentTime , p.id});
            }
            slotStartTime = currentTime;
            lastPatientId = p.id;
        }

        if (p.remainingTime == 0){
            p.completionTime = currentTime;
            timeline.push_back({slotStartTime , currentTime , p.id});
            lastPatientId = -1;
            completed.push_back(p);
        }
    }
    return MetricsCalculator::calculate("Pre-emptive Priority" , completed , timeline , currentTime);
}