using THPCore.Models;
using YouthUnion.Core.ExternalAPI.Models;

namespace YouthUnion.Core.ExternalAPI.Interfaces;

public interface IIdentityAPI
{
    Task<THPResult<HPuniUser>> LoginAsync(string userName, string password);
}