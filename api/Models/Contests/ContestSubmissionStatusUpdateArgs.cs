using System.ComponentModel.DataAnnotations;
using YouthUnion.Core.Entities;

namespace YouthUnion.Models.Contests;

public class ContestSubmissionStatusUpdateArgs
{
    [Required]
    public Guid SubmissionId { get; set; }

    [Required]
    public ContestSubmissionStatus Status { get; set; }

    [StringLength(2048)]
    public string? AdminNote { get; set; }
}