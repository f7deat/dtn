using THPCore.Models;
using YouthUnion.Models.Students;

namespace YouthUnion.Interfaces.IServices;

public interface IStudentService
{
    Task<ListResult<object>> ListAsync(StudentFilterOptions filterOptions);
}
