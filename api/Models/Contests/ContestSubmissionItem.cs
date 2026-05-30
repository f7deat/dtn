using THPCore.Infrastructures;
using YouthUnion.Core.Entities;

namespace YouthUnion.Models.Contests;

public class ContestSubmissionItem : AuditEntity
{
    public Guid ContestId { get; set; }

    public string UserId { get; set; } = default!;

    public string UserName { get; set; } = default!;

    public string? FullName { get; set; }

    public string? Email { get; set; }

    public string? PhoneNumber { get; set; }

    public string? CourseName { get; set; }
    public string? ClassName { get; set; }
    public string? FacultyName { get; set; } 

    public string OriginalFileName { get; set; } = default!;

    public string FileUrl { get; set; } = default!;

    public string? Note { get; set; }

    public ContestSubmissionStatus Status { get; set; }

    public string? AdminNote { get; set; }

    public DateTime SubmittedAt { get; set; }
}