declare namespace API {
    interface TResult<T = any> {
        succeeded: boolean;
        message: string;
        data: T;
    }
}