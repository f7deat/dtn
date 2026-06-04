using System.Net.Http.Headers;
using YouthUnion.ExternalAPI.Models.Response;

namespace YouthUnion.ExternalAPI;

public class HemsService : IHemsService
{
    private readonly HttpClient _client;

    public HemsService(HttpClient client, IHttpContextAccessor httpContextAccessor)
    {
        var context = httpContextAccessor.HttpContext;
        client.BaseAddress = new Uri("https://api.hems.dhhp.edu.vn/");
        if (context != null)
        {
            var authHeader = context.Request.Headers["Authorization"].ToString();
            var accessToken = authHeader.Replace("Bearer ", "");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        }
        _client = client;
    }

    public async Task<ListResponse<ListByUserNamesResponse>> ListByUserNamesAsync(List<string?> userNames)
    {
        var response = await _client.PostAsJsonAsync("student/list-by-user-names", new
        {
            userNames,
            current = 1,
            pageSize = 1000
        });
        if (!response.IsSuccessStatusCode)
        {
            throw new Exception($"Failed to get data from HEMS API. Status code: {response.StatusCode}");
        }
        var result = await response.Content.ReadFromJsonAsync<ListResponse<ListByUserNamesResponse>>();
        if (result == null)
        {
            throw new Exception("Failed to deserialize response from HEMS API.");
        }
        return result;
    }
}
