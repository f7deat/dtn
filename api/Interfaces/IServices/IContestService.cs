using THPCore.Models;
using YouthUnion.Models.Contests;

namespace YouthUnion.Interfaces.IServices;

public interface IContestService
{
    Task<THPResult> CreateAsync(ContestCreateArgs args);

    Task<THPResult> UpdateAsync(ContestUpdateArgs args);

    Task<THPResult> DeleteAsync(Guid id);

    Task<ListResult<ContestListItem>> ListAsync(ContestFilterOptions filterOptions, bool onlyActive);

    Task<object?> GetAsync(Guid id, bool onlyActive);

    Task<ListResult<ContestSubmissionItem>> GetSubmissionsAsync(Guid contestId, ContestSubmissionFilterOptions filterOptions);

    Task<List<ContestSubmissionItem>> GetMySubmissionsAsync(Guid contestId);

    Task<THPResult> UpdateSubmissionStatusAsync(ContestSubmissionStatusUpdateArgs args);

    Task<THPResult> DeleteSubmissionAsync(Guid submissionId);

    Task<THPResult> SubmitAsync(Guid contestId, IFormFile file, string? note);

    Task<(string ContestTitle, List<ContestSubmissionItem> Items)?> GetSubmissionExportAsync(Guid contestId);
}