using System.Text.Json.Serialization;
using THPIdentity.Entities;

namespace YouthUnion.Core.ExternalAPI.Models;

public class HPuniUser
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = default!;
    [JsonPropertyName("userName")]
    public string UserName { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("phoneNumber")]
    public string? PhoneNumber { get; set; }
    [JsonPropertyName("email")]
    public string? Email { get; set; }
    [JsonPropertyName("dateOfBirth")]
    public DateTime? DateOfBirth { get; set; }
    [JsonPropertyName("gender")]
    public bool? Gender { get; set; }
    [JsonPropertyName("avatar")]
    public string? Avatar { get; set; }
    [JsonPropertyName("departmentId")]
    public int? DepartmentId { get; set; }
    [JsonPropertyName("userType")]
    public UserType UserType { get; set; }
}

public class LoginAPIResponse
{
    [JsonPropertyName("user")]
    public HPuniUser? User { get; set; }
}