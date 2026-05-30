using System.ComponentModel.DataAnnotations;

namespace YouthUnion.Models.Contests;

public class ContestUpdateArgs : ContestCreateArgs
{
    [Required]
    public Guid Id { get; set; }
}