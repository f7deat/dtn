using THPCore.Models;
using THPIdentity.Entities;
using VnkCore.Data;
using YouthUnion.Interfaces.IServices;
using YouthUnion.Models.Students;

namespace YouthUnion.Services;

public class StudentService(VnkDbContext _vnkContext) : IStudentService
{
    public async Task<ListResult<object>> ListAsync(StudentFilterOptions filterOptions)
    {
        var query = from a in _vnkContext.Users
                    join b in _vnkContext.UserDetails on a.Id equals b.UserId
                    join c in _vnkContext.Departments on a.DepartmentId equals c.Id
                    where a.UserType == UserType.Student && a.Del == false
                    select new
                    {
                        a.Id,
                        FullName = a.FirstName + " " + a.LastName,
                        b.Gender,
                        b.DateOfBirth,
                        a.UserName,
                        a.DepartmentId,
                        a.ClassCode,
                        a.ClassName,
                        DepartmentName = c.Name
                    };
        if (!string.IsNullOrWhiteSpace(filterOptions.UserName))
        {
            query = query.Where(x => x.UserName.ToLower().Contains(filterOptions.UserName.ToLower()));
        }
        if (!string.IsNullOrWhiteSpace(filterOptions.FullName))
        {
            query = query.Where(x => x.FullName.ToLower().Contains(filterOptions.FullName.ToLower()));
        }
        if (!string.IsNullOrWhiteSpace(filterOptions.ClassCode))
        {
            query = query.Where(x => x.ClassCode.ToLower().Contains(filterOptions.ClassCode.ToLower()));
        }
        if (filterOptions.DepartmentId != null)
        {
            query = query.Where(x => x.DepartmentId == filterOptions.DepartmentId);
        }
        query = query.OrderByDescending(x => x.UserName);
        return await ListResult<object>.Success(query, filterOptions);
    }
}
