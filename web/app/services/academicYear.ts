import { createRequest } from "./request";

export async function apiAcademicYearOptions() {
  const response = await createRequest().get("academic-year/options");
  return (response.data?.data ?? response.data ?? []) as API.AcademicYearOption[];
}
