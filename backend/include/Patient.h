#ifndef PATIENT_H
#define PATIENT_H

struct Patient {
    int id;
    int arrivalTime;
    int treatmentTime;    // Alias for Burst Time
    int remainingTime;    
    int priority_level;   // 1(Highest Urgency) to 5(lowest) 

    int firstStartTime = -1;
    int completionTime = 0;
    int waitingTime = 0;
    int turnaroundTime = 0;

    Patient(int p_id , int arrival , int treatment, int priority){
        id = p_id;
        arrivalTime = arrival;
        treatmentTime = treatment;
        remainingTime = treatment;
        priority_level = priority;
    }
};

#endif