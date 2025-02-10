class apiRespose{
    constructor(statusCode, data, success, message = "success"){
        this.statusCode = statusCode 
        this.data = data
        this.message = message
        this.success = success
    }
}

export {apiRespose}