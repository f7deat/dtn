using System.ComponentModel.DataAnnotations;
using THPCore.Infrastructures;

namespace YouthUnion.Core.Entities;

public class Contest : AuditEntity
{
    [StringLength(512)]
    public string Title { get; set; } = default!;

    [StringLength(2048)]
    public string? Description { get; set; }

    public string? Content { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public bool IsActive { get; set; } = true;

    public virtual ICollection<ContestSubmission>? Submissions { get; set; }
}