using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using THPCore.Interfaces;
using YouthUnion.Infrastructure.Data;

namespace YouthUnion.Infrastructure.Repositories;

/// <summary>
/// "There's some repetition here - couldn't we have some the sync methods call the async?"
/// https://blogs.msdn.microsoft.com/pfxteam/2012/04/13/should-i-expose-synchronous-wrappers-for-asynchronous-methods/
/// </summary>
/// <typeparam name="T"></typeparam>
public class EfRepository<T>(ApplicationDbContext context) : IAsyncRepository<T> where T : class
{
    protected readonly ApplicationDbContext _context = context;

    public virtual async Task<T?> GetByIdAsync(int id) => await _context.Set<T>().FindAsync(id);

    public async Task<IReadOnlyList<T>> ListAllAsync() => await _context.Set<T>().ToListAsync();

    public async Task<T> AddAsync(T entity)
    {
        _context.Set<T>().Add(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public async Task<T> UpdateAsync(T entity)
    {
        _context.Entry(entity).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return entity;
    }

    public async Task DeleteAsync(T entity)
    {
        _context.Set<T>().Remove(entity);
        await _context.SaveChangesAsync();
    }

    public IDbContextTransaction BeginTransaction() => _context.Database.BeginTransaction();

    public async Task<int> CountAsync() => await _context.Set<T>().CountAsync();

    public async Task<T?> FindAsync(int id) => await _context.Set<T>().FindAsync(id);

    public async Task<T?> FindAsync(long id) => await _context.Set<T>().FindAsync(id);

    public async Task<T?> FindAsync(Guid id) => await _context.Set<T>().FindAsync(id);

    public async Task<int> SaveChangesAsync() => await _context.SaveChangesAsync();
}
