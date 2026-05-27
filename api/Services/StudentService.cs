using THPCore.Interfaces;
using THPCore.Models;
using THPIdentity.Entities;
using VnkCore.Data;
using YouthUnion.ExternalAPI;
using YouthUnion.Infrastructure.Data;
using YouthUnion.Interfaces.IServices;
using YouthUnion.Models.Students;

namespace YouthUnion.Services;

public class StudentService(ApplicationDbContext _vnkContext, IHCAService _hcaService, IHemsService _hemsService) : IStudentService
{
    public async Task<THPResult> GetProfileAsync()
    {
        var userId = _hcaService.GetUserId();
        var user = await _vnkContext.Users.FindAsync(userId);
        if (user is null) return THPResult.Failed("Không tìm thấy sinh viên!");
        var response = await _hemsService.ListByUserNamesAsync([user.UserName]);
        if (response.Data is null) return THPResult.Failed("Không tìm thấy sinh viên!");
        var hpuniUser = response.Data.FirstOrDefault();
        return THPResult.Ok(new
        {
            UserId = userId,
            user.Name,
            user.Gender,
            user.DepartmentId,
            user.Email,
            user.PhoneNumber,
            user.DateOfBirth,
            hpuniUser?.ClassCode,
            hpuniUser?.DepartmentName
        });
    }

    public async Task<ListResult<object>> ListAsync(StudentFilterOptions filterOptions)
    {
        var query = from a in _vnkContext.Users
                    join c in _vnkContext.Departments on a.DepartmentId equals c.Id
                    where a.UserType == UserType.Student
                    select new
                    {
                        a.Id,
                        FullName = a.Name,
                        a.Gender,
                        a.DateOfBirth,
                        a.UserName,
                        a.DepartmentId,
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
        if (filterOptions.DepartmentId != null)
        {
            query = query.Where(x => x.DepartmentId == filterOptions.DepartmentId);
        }
        query = query.OrderByDescending(x => x.UserName);
        return await ListResult<object>.Success(query, filterOptions);
    }
}
