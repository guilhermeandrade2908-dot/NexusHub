using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjetosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProjetosController(AppDbContext context)
        {
            _context = context;
        }

        // GET - Listar todos os projetos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Projeto>>> GetProjetos()
        {
            return await _context.Projetos.ToListAsync();
        }

        // GET por ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Projeto>> GetProjeto(int id)
        {
            var projeto = await _context.Projetos.FindAsync(id);
            if (projeto == null) return NotFound();
            return projeto;
        }

        // POST - Criar novo projeto
        [HttpPost]
        public async Task<ActionResult<Projeto>> PostProjeto(Projeto projeto)
        {
            _context.Projetos.Add(projeto);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProjeto), new { id = projeto.Id }, projeto);
        }

        // PUT - Editar projeto existente
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProjeto(int id, [FromBody] Projeto projeto)
        {
            if (id != projeto.Id) return BadRequest();

            _context.Entry(projeto).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProjetoExists(id)) return NotFound();
                throw;
            }

            return NoContent();
        }

        // DELETE - Excluir projeto
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProjeto(int id)
        {
            var projeto = await _context.Projetos.FindAsync(id);
            if (projeto == null) return NotFound();

            _context.Projetos.Remove(projeto);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ProjetoExists(int id)
        {
            return _context.Projetos.Any(e => e.Id == id);
        }
    }
}
