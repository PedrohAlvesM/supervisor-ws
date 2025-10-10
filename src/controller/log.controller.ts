export const LogController = {
    LogEvent(from: string, toLog: string) {
        const datetime = new Date();
        console.log(`[LOG] from: ${from}. ${toLog} at ${datetime.getHours()}:${datetime.getMinutes()}:${datetime.getSeconds()}.${datetime.getMilliseconds()}`);
    },
    
    LogError(from: string, toLog: string) {
        const datetime = new Date();
        console.log(`[ERROR] from: ${from}. ${toLog} at ${datetime.getHours()}:${datetime.getMinutes()}:${datetime.getSeconds()}.${datetime.getMilliseconds()}`);
    }
}