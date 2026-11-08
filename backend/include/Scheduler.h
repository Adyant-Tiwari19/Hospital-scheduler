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

#endif