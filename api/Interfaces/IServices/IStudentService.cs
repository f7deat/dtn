using THPCore.Models;
using YouthUnion.Models.Students;

namespace YouthUnion.Interfaces.IServices;

public interface IStudentService
{
    Task<THPResult> GetProfileAsync();
    Task<ListResult<object>> ListAsync(StudentFilterOptions filterOptions);
}
