using System.Text.Json.Serialization;

namespace YouthUnion.ExternalAPI.Models.Response;

public class ListResponse<T>
{
    [JsonPropertyName("data")]
    public List<T>? Data { get; set; }
}
