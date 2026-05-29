using System.ComponentModel.DataAnnotations;

namespace YouthUnion.Models.AcademicYears;

public class AcademicYearCreateRequest
{
    [StringLength(256)]
    public string Name { get; set; } = default!;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
}