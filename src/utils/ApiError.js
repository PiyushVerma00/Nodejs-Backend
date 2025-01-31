class apiError extends Error{
    constructor(
        statuscode,
        message = "Something Went Worng",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statuscode = statuscode
        this.data = null
        this.message = message
        this.success =false
        this.errors = errors

    }
}

export {apiError}