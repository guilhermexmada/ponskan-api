class HealthService{
    async test(){
        try {
            return{
                api: 'rodando',
                uptime: process.uptime(),
                timestamp: new Date()
            }
        } catch (error) {
            console.log(error)
        }
    }
}

export default new HealthService()