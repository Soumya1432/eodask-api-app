declare class SchedulerService {
    private jobs;
    init(): void;
    private scheduleJob;
    private checkOverdueTasks;
    private sendDailyDigest;
    private cleanupExpiredTokens;
    private cleanupExpiredInvitations;
    private sendTaskReminders;
    stopAll(): void;
}
export declare const schedulerService: SchedulerService;
export {};
//# sourceMappingURL=scheduler.service.d.ts.map