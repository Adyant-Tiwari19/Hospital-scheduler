#ifndef PATIENT_H
#define PATIENT_H

struct Patient {
    int id;
    int arrivalTime;
    int treatmentTime;    // Alias for Burst Time
    int remainingTime;    
    int priority_level;   // 1(Highest Urgency) to 5(lowest) 

    int firstStartTime;
    int completionTime;
    int waitingTime;
    int responseTime;

    Patient(int p_id , int arrival , int treatment, int priority){
        id = p_id;
        arrivalTime = arrival;
        treatmentTime = treatment;
        priority_level = priority;
    }
};

#endif