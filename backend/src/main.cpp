#include "../include/Patient.h"
#include "../include/Metrics.h"
#include "../include/Scheduler.h"
#include <vector>
using namespace std;

int main(){
    vector<Patient> inputConfig = {
        Patient(1,0,5,3),
        Patient(2,1,3,1),
        Patient(3,2,8,4),
        Patient(4,3,2,2)
    };

    FCFSScheduler fcfs;
    SimulationMetrics fcfsResults = fcfs.run(inputConfig);
    MetricsCalculator::printReport(fcfsResults);

    return 0;
}