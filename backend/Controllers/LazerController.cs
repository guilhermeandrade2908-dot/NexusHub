using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LazerController : ControllerBase
    {
        private readonly AppDbContext _context;
        
        public LazerController(AppDbContext context)
        {
            _context = context;
        }

        // GET:
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Lazer>>> GetLazeres()
        {
            return await _context.Lazeres.ToListAsync();
        }

        // GET por ID:
        [HttpGet("{id}")]
        public async Task<ActionResult<Lazer>> GetLazer(int id)
        {
            var lazer = await _context.Lazeres.FindAsync(id);

            if (lazer == null) return NotFound();

            return lazer;
        }

        // POST:
        [HttpPost]
        public async Task<ActionResult<Lazer>> PostLazer(Lazer lazer)
        {
            _context.Lazeres.Add(lazer);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLazer), new {id = lazer.Id}, lazer);
        }

        // PUT:
        [HttpPut("{id}")]
        public async Task<IActionResult> PutLazer(int id, [FromBody] Lazer lazer)
        {
            if (id != lazer.Id) return BadRequest();

            _context.Entry(lazer).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!LazerExists(id)) return NotFound();
                throw;
            }

            return NoContent();
        }

        // DELETE:
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLazer(int id)
        {
            var lazer = await _context.Lazeres.FindAsync(id);

            if (lazer == null) return NotFound();

            _context.Lazeres.Remove(lazer);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool LazerExists(int id)
        {
            return _context.Lazeres.Any(e => e.Id == id);
        }
    }
}