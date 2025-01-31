class apiRespose{
    constructor(statusCode, data, success, message = "success"){
        this.statusCode = statusCode >400
        this.data = data
        this.message = message
        this.success = success
    }
}