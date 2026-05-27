using System.Text.Json.Serialization;

namespace YouthUnion.ExternalAPI.Models.Response;

public class ListByUserNamesResponse
{
    [JsonPropertyName("userName")]
    public string UserName { get; set; } = default!;
    [JsonPropertyName("classCode")]
    public string? ClassCode { get; set; }
    [JsonPropertyName("courseName")]
    public string? CourseName { get; set; }
    [JsonPropertyName("departmentName")]
    public string? DepartmentName { get; set; }
}
