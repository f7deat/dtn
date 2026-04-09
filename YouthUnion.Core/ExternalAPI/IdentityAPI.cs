using System.Net.Http.Json;
using THPCore.Models;
using YouthUnion.Core.ExternalAPI.Interfaces;
using YouthUnion.Core.ExternalAPI.Models;

namespace YouthUnion.Core.ExternalAPI;

public class IdentityAPI(HttpClient _client) : IIdentityAPI
{
    public async Task<THPResult<HPuniUser>> LoginAsync(string userName, string password)
    {
        var url = "https://identity.dhhp.edu.vn/login/password-sign-in";
        var response = await _client.PostAsJsonAsync(url, new
        {
            UserName = userName,
            Password = password
        });
        var b = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode) return THPResult<HPuniUser>.Failed("Đăng nhập thất bại");
        var data = await response.Content.ReadFromJsonAsync<LoginAPIResponse>();
        if (data is null || data.User is null) return THPResult<HPuniUser>.Failed("Đăng nhập thất bại");
        return THPResult<HPuniUser>.Ok(data.User);
    }
}
