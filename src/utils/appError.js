class AppError extends Error {
    constructor(message, statusCode, errorDetails = null) {
        super(message) // chama construtor da classe Error
        this.statusCode = statusCode
        this.errorDetails = errorDetails
        this.isOperational = true // diferencia erro previsto de bugs
        Error.captureStackTrace(this, this.constructor) // cria propriedade .stack (rastro do erro) escondendo as referências à classe AppError
    }
}

export default AppError