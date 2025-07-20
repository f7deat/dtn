using THPCore.Models;

namespace YouthUnion.Models.Students;

public class StudentFilterOptions : FilterOptions
{
    public string? UserName { get; set; }
    public string? FullName { get; set; }
    public string? ClassCode { get; set; }
    public int? DepartmentId { get; set; }
}
