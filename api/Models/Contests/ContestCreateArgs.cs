using System.ComponentModel.DataAnnotations;

namespace YouthUnion.Models.Contests;

public class ContestCreateArgs
{
    [Required]
    [StringLength(512)]
    public string Title { get; set; } = default!;

    [StringLength(2048)]
    public string? Description { get; set; }

    public string? Content { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public bool IsActive { get; set; } = true;
}