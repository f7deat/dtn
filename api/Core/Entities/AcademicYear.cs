using System.ComponentModel.DataAnnotations;
using THPCore.Infrastructures;

namespace YouthUnion.Core.Entities;

public class AcademicYear : BaseEntity<int>
{
    [StringLength(256)]
    public string Name { get; set; } = default!;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }

    public virtual ICollection<Semester>? Semesters { get; set; }
}
