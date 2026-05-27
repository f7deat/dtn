import { StudentProfile } from "../../typings/student";
import request from "./request";

export async function apiStudentProfile() {
    return request<API.TResult<StudentProfile>>({
        url: "student/profile",
        method: "GET",
    });
}