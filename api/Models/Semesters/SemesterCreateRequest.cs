using System.ComponentModel.DataAnnotations;

namespace YouthUnion.Models.Semesters;

public class SemesterCreateRequest
{
    [StringLength(256)]
    public string Name { get; set; } = default!;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int AcademicYearId { get; set; }
}