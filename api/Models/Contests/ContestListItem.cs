using THPCore.Infrastructures;

namespace YouthUnion.Models.Contests;

public class ContestListItem : AuditEntity
{
    public string Title { get; set; } = default!;

    public string? Description { get; set; }

    public string? Content { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public bool IsActive { get; set; }

    public bool IsOpened { get; set; }

    public bool HasEnded { get; set; }

    public int SubmissionCount { get; set; }
}