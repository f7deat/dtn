using THPCore.Models;

namespace YouthUnion.Models.Semesters;

public class SemesterFilterOptions : FilterOptions
{
    public string? Name { get; set; }
    public int? AcademicYearId { get; set; }
}