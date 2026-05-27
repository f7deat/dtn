using YouthUnion.ExternalAPI.Models.Response;

namespace YouthUnion.ExternalAPI;

public interface IHemsService
{
    Task<ListResponse<ListByUserNamesResponse>> ListByUserNamesAsync(List<string?> userNames);
}
