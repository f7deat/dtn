using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using THPCore.Infrastructures;

namespace YouthUnion.Core.Entities;

public class ContestSubmission : AuditEntity
{
    [ForeignKey(nameof(Contest))]
    public Guid ContestId { get; set; }

    [StringLength(450)]
    public string UserId { get; set; } = default!;

    [StringLength(256)]
    public string UserName { get; set; } = default!;

    [StringLength(512)]
    public string? FullName { get; set; }

    [StringLength(256)]
    public string? Email { get; set; }

    [StringLength(64)]
    public string? PhoneNumber { get; set; }

    [StringLength(512)]
    public string OriginalFileName { get; set; } = default!;

    [StringLength(2048)]
    public string FileUrl { get; set; } = default!;

    [StringLength(2048)]
    public string StoredFilePath { get; set; } = default!;

    [StringLength(2048)]
    public string? Note { get; set; }

    public ContestSubmissionStatus Status { get; set; } = ContestSubmissionStatus.Pending;

    [StringLength(2048)]
    public string? AdminNote { get; set; }

    public DateTime SubmittedAt { get; set; }

    public virtual Contest? Contest { get; set; }
}

public enum ContestSubmissionStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2,
}