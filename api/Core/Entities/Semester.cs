using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using THPCore.Infrastructures;

namespace YouthUnion.Core.Entities;

public class Semester : BaseEntity<int>
{
    [StringLength(256)]
    public string Name { get; set; } = default!;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }

    [ForeignKey(nameof(AcademicYear))]
    public int AcademicYearId { get; set; }

    public virtual AcademicYear AcademicYear { get; set; } = default!;
}