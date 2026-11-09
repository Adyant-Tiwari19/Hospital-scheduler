#ifndef SCHEDULER_H
#define SCHEDULER_H

#include "Patient.h"
#include "Metrics.h"
#include <vector>

class Scheduler{
public:
    virtual ~Scheduler() = default;
    virtual SimulationMetrics run(vector<Patient> inputPatients) = 0;
};

class FCFSScheduler : public Scheduler {
public:
    SimulationMetrics run(vector<Patient> inputPatients) override;
};

class NonPreemptiveSFJScheduler : public Scheduler {
public:
    SimulationMetrics run(vector<Patient> inputPatients) override;
};

class PreemptiveSRTFScheduer : public Scheduler {
public:
    SimulationMetrics run(vector<Patient> inputPatients) override;
};

class PreemptivePriorityScheduler : public Scheduler {
public:
    SimulationMetrics run(vector<Patient> inputPatients) override;
};

class NonPreemptivePriorityScheduler : public Scheduler {
public:
    SimulationMetrics run(vector<Patient> inputPatients) override;
};

class RobinRoundScheduler : public Scheduler {

private:
    int timeQuantum;
public:
    RobinRoundScheduler(int quantum = 2){
        timeQuantum = quantum;
    }
    SimulationMetrics run(vector<Patient> inputPatients) override;
};

#endif