export const handleDatabaseError = (error, requestId, context) => {
    console.error(`[Admin ${requestId}] ${context}:`, {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
    });
    return {
        success: false,
        error: context,
        details: error.message,
    };
};
export const handleUnexpectedError = (error, requestId, context) => {
    console.error(`[Admin ${requestId}] ${context}:`, {
        message: error.message,
        stack: error.stack,
        name: error.name,
    });
    return {
        success: false,
        error: context,
        details: error.message,
    };
};
