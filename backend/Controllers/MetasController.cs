using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MetasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MetasController(AppDbContext context)
        {
            _context = context;
        }

        // GET:
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Meta>>> GetMetas()
        {
            return await _context.Metas.ToListAsync();
        }

        // POST:
        [HttpPost]
        public async Task<ActionResult<Meta>> PostMeta(Meta meta)
        {
            _context.Metas.Add(meta);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMetas), new {id = meta.Id}, meta);
        }

        // PUT:
        [HttpPut("{id}")]
        public async Task<IActionResult> PutMeta(int id, Meta meta)
        {
            if (id != meta.Id) return BadRequest("ID divergente.");

            _context.Entry(meta).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            } 
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Metas.Any(e => e.Id == id)) return NotFound();
                else throw;
            }  

            return NoContent();     
        }

        // DELETE:
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMeta(int id)
        {
            var meta = await _context.Metas.FindAsync(id);
            if (meta == null) return NotFound();

            _context.Metas.Remove(meta);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}